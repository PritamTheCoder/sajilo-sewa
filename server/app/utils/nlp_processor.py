"""Rule-based bilingual (Romanized Nepali + English) sentiment analysis for review
comments. No ML model — a signed lexicon plus regex rules for negation, intensifiers,
and VADER-style score normalization.

CLI:  python -m app.utils.nlp_processor "Ekdam ramro service, khusi lagyo"
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from typing import Dict, List, Tuple


_POSITIVE: Dict[str, float] = {
    'ramro': 3.0, 'raamro': 3.0, 'ramrai': 3.0, 'khusi': 3.0, 'khushi': 3.0,
    'jhakkas': 3.0, 'badhiya': 3.0, 'badiya': 3.0, 'mitho': 3.0,
    'dhanyabaad': 3.0, 'dhanyabad': 3.0, 'sundar': 3.0,
    'excellent': 3.0, 'amazing': 3.0, 'awesome': 3.0, 'love': 3.0, 'loved': 3.0,
    'best': 3.0, 'perfect': 3.0, 'wonderful': 3.0, 'superb': 3.0, 'fantastic': 3.0,
    'asal': 2.0, 'safa': 2.0, 'chhito': 2.0, 'chito': 2.0, 'sajilo': 2.0,
    'samman': 2.0, 'bhalo': 2.0,
    'good': 2.0, 'great': 2.0, 'nice': 2.0, 'happy': 2.0, 'satisfied': 2.0,
    'professional': 2.0, 'friendly': 2.0, 'helpful': 2.0, 'reliable': 2.0,
    'recommend': 2.0, 'recommended': 2.0, 'quality': 2.0, 'polite': 2.0,
    'clean': 2.0, 'fast': 2.0, 'affordable': 2.0, 'value': 2.0,
    'thik': 1.0, 'thikai': 1.0, 'ok': 1.0, 'okay': 1.0, 'fine': 1.0,
    'decent': 1.0, 'sasto': 1.0, 'cheap': 1.0,
    'man_paryo': 2.5,
}

_NEGATIVE: Dict[str, float] = {
    'naramro': -3.0, 'kharab': -3.0, 'kharaab': -3.0, 'jhur': -3.0, 'bekar': -3.0,
    'khattam': -3.0, 'thag': -3.0, 'thagyo': -3.0,
    'worst': -3.0, 'terrible': -3.0, 'awful': -3.0, 'horrible': -3.0, 'hate': -3.0,
    'scam': -3.0, 'cheated': -3.0, 'disgusting': -3.0, 'pathetic': -3.0,
    'phohor': -2.0, 'fohor': -2.0, 'mahango': -2.0, 'dhilo': -2.0, 'jhanjhat': -2.0,
    'garo': -2.0,
    'bad': -2.0, 'poor': -2.0, 'disappointed': -2.0, 'disappointing': -2.0,
    'rude': -2.0, 'unprofessional': -2.0, 'waste': -2.0, 'dirty': -2.0,
    'expensive': -2.0, 'slow': -2.0, 'late': -2.0, 'delay': -2.0, 'delayed': -2.0,
    'unreliable': -2.0, 'broken': -2.0, 'useless': -2.0,
    'meh': -1.0, 'average': -1.0, 'ordinary': -1.0,
    'man_pardaina': -2.5,
}

LEXICON: Dict[str, float] = {**_POSITIVE, **_NEGATIVE}

_INTENSIFIERS: Dict[str, float] = {
    'ekdam': 1.5, 'dherai': 1.5, 'atti': 1.5, 'ati': 1.5, 'nikai': 1.5, 'niki': 1.5,
    'very': 1.5, 'really': 1.5, 'so': 1.4, 'super': 1.5, 'extremely': 1.6,
    'too': 1.4, 'highly': 1.5,
}
_DOWNTONERS: Dict[str, float] = {
    'ali': 0.6, 'alikati': 0.6, 'thorai': 0.6, 'slightly': 0.6, 'bit': 0.7,
    'kinda': 0.7, 'somewhat': 0.7,
}

# English negation precedes its target ("not good"); Nepali negation follows it
# ("ramro chaina"). Split by direction so an earlier complaint isn't flipped by a
# later cue like the "never" in "late and expensive, never again".
_PRE_NEGATIONS = {
    'not', 'no', 'never', 'without', "n't", 'nt',
    'dont', 'doesnt', 'didnt', 'cant', 'wont', 'isnt', 'wasnt',
}
_POST_NEGATIONS = {
    'chaina', 'chhaina', 'xaina', 'bhayena', 'vayena', 'hoina',
    'pardaina', 'pardena', 'garena', 'aayena',
}

_PHRASES: List[Tuple[Tuple[str, ...], str]] = [
    (('man', 'paryo'), 'man_paryo'),
    (('man', 'pardaina'), 'man_pardaina'),
    (('man', 'pardena'), 'man_pardaina'),
]

_ALPHA = 15.0
_PRE_NEG_WINDOW = 3
_POST_NEG_WINDOW = 2
_INTENS_WINDOW = 2
_POS_THRESHOLD = 0.05
_NEG_THRESHOLD = -0.05
_EXCL_BOOST = 0.30
_EXCL_CAP = 4

_TOKEN_RE = re.compile(r"[a-z]+(?:'[a-z]+)?")
_ELONGATION_RE = re.compile(r"(.)\1{2,}")


@dataclass
class SentimentResult:
    label: str                       # 'positive' | 'negative' | 'neutral'
    score: float                     # signed compound in [-1, 1]
    weight: float                    # confidence in the label = |score|
    positive: float
    negative: float
    matched: List[Tuple[str, float]] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            'label': self.label,
            'score': round(self.score, 4),
            'weight': round(self.weight, 4),
            'positive': round(self.positive, 3),
            'negative': round(self.negative, 3),
            'matched': [(t, round(w, 3)) for t, w in self.matched],
        }


def _normalize(text: str) -> str:
    return _ELONGATION_RE.sub(r"\1\1", text.lower())


def _fold_phrases(tokens: List[str]) -> List[str]:
    folded: List[str] = []
    i = 0
    while i < len(tokens):
        for phrase, replacement in _PHRASES:
            n = len(phrase)
            if tuple(tokens[i:i + n]) == phrase:
                folded.append(replacement)
                i += n
                break
        else:
            folded.append(tokens[i])
            i += 1
    return folded


def _is_negated(tokens: List[str], index: int) -> bool:
    for j in range(max(0, index - _PRE_NEG_WINDOW), index):
        if tokens[j] in _PRE_NEGATIONS:
            return True
    for j in range(index + 1, min(len(tokens), index + _POST_NEG_WINDOW + 1)):
        if tokens[j] in _POST_NEGATIONS:
            return True
    return False


def _intensifier_for(tokens: List[str], index: int) -> float:
    multiplier = 1.0
    for j in range(max(0, index - _INTENS_WINDOW), index):
        if tokens[j] in _INTENSIFIERS:
            multiplier *= _INTENSIFIERS[tokens[j]]
        elif tokens[j] in _DOWNTONERS:
            multiplier *= _DOWNTONERS[tokens[j]]
    return multiplier


def analyze_sentiment(text: str) -> SentimentResult:
    """Classify text as positive / negative / neutral. `weight` is the confidence
    in the label. Empty or sentiment-free text is neutral with weight 0."""
    if not text or not text.strip():
        return SentimentResult('neutral', 0.0, 0.0, 0.0, 0.0, [])

    normalized = _normalize(text)
    excl_count = min(normalized.count('!'), _EXCL_CAP)
    tokens = _fold_phrases(_TOKEN_RE.findall(normalized))

    matched: List[Tuple[str, float]] = []
    pos_sum = 0.0
    neg_sum = 0.0

    for i, tok in enumerate(tokens):
        base = LEXICON.get(tok)
        if base is None:
            continue
        contribution = base * _intensifier_for(tokens, i)
        if _is_negated(tokens, i):
            contribution = -contribution * 0.7
        matched.append((tok, contribution))
        if contribution >= 0:
            pos_sum += contribution
        else:
            neg_sum += -contribution

    raw = pos_sum - neg_sum
    if raw != 0 and excl_count:
        raw += math.copysign(excl_count * _EXCL_BOOST, raw)

    compound = raw / math.sqrt(raw * raw + _ALPHA) if raw != 0 else 0.0

    if compound >= _POS_THRESHOLD:
        label = 'positive'
    elif compound <= _NEG_THRESHOLD:
        label = 'negative'
    else:
        label = 'neutral'

    return SentimentResult(label, compound, abs(compound), pos_sum, neg_sum, matched)


if __name__ == '__main__':
    import sys
    import json

    sample = ' '.join(sys.argv[1:]) or 'Ekdam ramro service, khusi lagyo'
    print(json.dumps(analyze_sentiment(sample).as_dict(), indent=2, ensure_ascii=False))
