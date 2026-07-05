"""Evaluation harness: runs the analyzer over the labeled set and prints per-class
precision/recall/F1, accuracy, macro-F1, and a confusion matrix. Standard library only.

    python tests/evaluate_nlp.py
"""

from __future__ import annotations

import os
import sys
from collections import defaultdict

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(_THIS_DIR))
sys.path.insert(0, _THIS_DIR)

from app.utils.nlp_processor import analyze_sentiment  # noqa: E402
from nlp_eval_data import EVAL_SET, LABELS            # noqa: E402


def evaluate(eval_set=EVAL_SET, labels=LABELS):
    confusion = {g: defaultdict(int) for g in labels}
    rows = []
    correct = 0

    for text, gold in eval_set:
        result = analyze_sentiment(text)
        pred = result.label
        confusion[gold][pred] += 1
        rows.append((text, gold, pred, result.weight, pred == gold))
        if pred == gold:
            correct += 1

    total = len(eval_set)
    accuracy = correct / total if total else 0.0

    per_class = {}
    macro_f1 = 0.0
    for lbl in labels:
        tp = confusion[lbl][lbl]
        fp = sum(confusion[g][lbl] for g in labels if g != lbl)
        fn = sum(confusion[lbl][p] for p in labels if p != lbl)
        precision = tp / (tp + fp) if (tp + fp) else 0.0
        recall = tp / (tp + fn) if (tp + fn) else 0.0
        f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
        support = sum(confusion[lbl].values())
        per_class[lbl] = {
            'precision': precision, 'recall': recall, 'f1': f1, 'support': support,
        }
        macro_f1 += f1
    macro_f1 /= len(labels) if labels else 1

    metrics = {'accuracy': accuracy, 'macro_f1': macro_f1, 'correct': correct, 'total': total}
    return rows, confusion, per_class, metrics


def _print_report(rows, confusion, per_class, metrics, labels=LABELS):
    line = '=' * 68
    print(line)
    print('  Sajilo Sewa — Rule-Based Sentiment Analyzer :: Evaluation Report')
    print(line)

    # Per-class metrics table.
    print('\nPer-class metrics')
    print(f"  {'label':<10}{'precision':>11}{'recall':>10}{'f1':>10}{'support':>10}")
    for lbl in labels:
        m = per_class[lbl]
        print(f"  {lbl:<10}{m['precision']:>11.3f}{m['recall']:>10.3f}{m['f1']:>10.3f}{m['support']:>10}")

    print('\nOverall')
    print(f"  accuracy : {metrics['accuracy']:.3f}  ({metrics['correct']}/{metrics['total']})")
    print(f"  macro-F1 : {metrics['macro_f1']:.3f}")

    print('\nConfusion matrix  (rows = gold, cols = predicted)')
    header = ' ' * 12 + ''.join(f'{l[:4]:>8}' for l in labels)
    print(header)
    for g in labels:
        cells = ''.join(f'{confusion[g][p]:>8}' for p in labels)
        print(f'  {g:<10}{cells}')

    errors = [r for r in rows if not r[4]]
    print(f'\nMisclassifications ({len(errors)})')
    if not errors:
        print('  (none)')
    for text, gold, pred, weight, _ in errors:
        print(f'  gold={gold:<8} pred={pred:<8} w={weight:.2f}  "{text}"')
    print(line)


def main():
    rows, confusion, per_class, metrics = evaluate()
    _print_report(rows, confusion, per_class, metrics)


if __name__ == '__main__':
    main()
