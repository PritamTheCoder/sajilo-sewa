"""Labeled (text, gold_label) evaluation set for the sentiment analyzer. Mixes
Romanized Nepali and English, and includes a few mixed/sarcastic reviews a lexicon
model is expected to miss, so the reported metrics stay honest."""

EVAL_SET = [
    # Positive
    ("Ekdam ramro service, khusi lagyo", "positive"),
    ("Very professional and clean work", "positive"),
    ("Kaam ramro bhayo, dhanyabaad", "positive"),
    ("Great job, highly recommend", "positive"),
    ("Plumber chhito aayo ra safa kaam garyo", "positive"),
    ("Mitho khana banayo, ekdam khusi", "positive"),
    ("Asal manche, professional service", "positive"),
    ("Fast, friendly and affordable", "positive"),
    ("Ramro thiyo overall", "positive"),
    ("Sabai kaam thik cha, satisfied", "positive"),
    ("Excellent work, man paryo", "positive"),
    ("Best service in Kathmandu", "positive"),
    ("Dherai ramro, recommend garchu", "positive"),
    ("Time mai aayo, professional", "positive"),
    ("Loved the work, very clean", "positive"),
    ("Jhakkas kaam, ekdam satisfied", "positive"),

    # Negative
    ("Naramro service, dhilo aayo", "negative"),
    ("Very rude and unprofessional", "negative"),
    ("Kaam ramro bhayena, paisa kher", "negative"),
    ("Terrible experience, waste of money", "negative"),
    ("Dhilo, mahango ra phohor kaam", "negative"),
    ("Worst plumber, thagyo", "negative"),
    ("Disappointed, kaam bekar thiyo", "negative"),
    ("Late and expensive, never again", "negative"),
    ("Service ramro chaina", "negative"),
    ("Jhur kaam, man pardaina", "negative"),
    ("Rude behavior, paisa firta magyo", "negative"),
    ("Kharab experience", "negative"),
    ("Broken pipe again, unreliable", "negative"),
    ("Slow service and dirty", "negative"),
    ("Bekar, samay barbaad", "negative"),

    # Neutral (no sentiment cues)
    ("Plumber aaja aayo ra kaam garyo", "neutral"),
    ("Booking gareko thiyo two days ago", "neutral"),
    ("He came and fixed the tap", "neutral"),
    ("Provider le call garyo", "neutral"),
    ("The service was completed today", "neutral"),
    ("Payment cash ma diyeko", "neutral"),
    ("Kaam sakiyo, receipt paiyo", "neutral"),

    # Hard cases: contrastive "tara/but" clauses and sarcasm
    ("Ekdam ramro bhaneko thiye tara dhilo aayo", "negative"),
    ("Kaam ramro cha tara mahango", "negative"),
    ("Wow, great service, only 3 hours late", "negative"),
]

LABELS = ("positive", "negative", "neutral")
