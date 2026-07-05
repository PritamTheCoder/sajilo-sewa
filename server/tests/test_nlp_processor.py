import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pytest

from app.utils.nlp_processor import analyze_sentiment


def test_ut03_strongly_positive_bilingual_review():
    # UT-03: strongly positive bilingual feedback → positive class, weight > 0.85.
    result = analyze_sentiment("Ekdam ramro service, khusi lagyo")
    assert result.label == "positive"
    assert result.weight > 0.85


@pytest.mark.parametrize("text", [
    "Very professional and clean work",
    "Kaam ramro bhayo, dhanyabaad",
    "Great job, highly recommend",
    "Mitho khana banayo, ekdam khusi",
])
def test_positive_texts(text):
    assert analyze_sentiment(text).label == "positive"


@pytest.mark.parametrize("text", [
    "Naramro service, dhilo aayo",
    "Very rude and unprofessional",
    "Terrible experience, waste of money",
    "Worst plumber, thagyo",
])
def test_negative_texts(text):
    assert analyze_sentiment(text).label == "negative"


@pytest.mark.parametrize("text", [
    "Plumber aaja aayo ra kaam garyo",
    "The service was completed today",
    "Payment cash ma diyeko",
    "",
    "   ",
])
def test_neutral_texts(text):
    assert analyze_sentiment(text).label == "neutral"


def test_negation_english_flips_polarity():
    assert analyze_sentiment("good service").label == "positive"
    assert analyze_sentiment("not good service").label == "negative"


def test_negation_nepali_postfix_flips_polarity():
    # Nepali negation follows the adjective: "ramro chaina" = good is-not.
    assert analyze_sentiment("ramro").label == "positive"
    assert analyze_sentiment("service ramro chaina").label == "negative"


def test_intensifier_increases_confidence():
    plain = analyze_sentiment("ramro")
    intensified = analyze_sentiment("ekdam ramro")
    assert intensified.weight > plain.weight


def test_score_is_bounded():
    result = analyze_sentiment("ramro ramro ramro excellent amazing best perfect awesome")
    assert -1.0 <= result.score <= 1.0
    assert result.label == "positive"


def test_weight_matches_absolute_score():
    result = analyze_sentiment("terrible awful worst")
    assert result.weight == pytest.approx(abs(result.score))


def test_elongation_is_normalized():
    assert analyze_sentiment("raaaamro service").label == "positive"


def test_evaluation_accuracy_threshold():
    from evaluate_nlp import evaluate
    _, _, _, metrics = evaluate()
    assert metrics["accuracy"] >= 0.85
