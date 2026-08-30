"""
train_classifier.py
-------------------
Trains an XGBoost multi-class classifier on the synthetic pollution dataset.
Saves model to: ml/models/classifier_v1.pkl

Run:
    python ml/train_classifier.py
"""

import os
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix
import xgboost as xgb

DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "datasets", "pollution_classification_synthetic.csv")
MODEL_DIR    = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH   = os.path.join(MODEL_DIR, "classifier_v1.pkl")
ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder_v1.pkl")

FEATURES = [
    "hour", "month", "day_of_week", "is_weekend",
    "pm25", "pm10", "so2", "nox", "no2", "co",
    "wind_speed", "temperature", "humidity",
    "pm_ratio", "nox_so2_ratio",
]

SEED = 42


def main():
    print("Loading dataset:", DATASET_PATH)
    df = pd.read_csv(DATASET_PATH)
    print("  Rows:", len(df), "| Labels:", df["label"].value_counts().to_dict())

    X = df[FEATURES].values
    y_raw = df["label"].values

    le = LabelEncoder()
    y = le.fit_transform(y_raw)
    print("  Label encoding:", dict(zip(le.classes_, le.transform(le.classes_))))

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=SEED, stratify=y
    )
    print("  Train:", len(X_train), "| Test:", len(X_test))

    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        use_label_encoder=False,
        eval_metric="mlogloss",
        random_state=SEED,
        n_jobs=-1,
    )

    print("\nTraining XGBoost classifier...")
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=50,
    )

    y_pred = model.predict(X_test)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    cv_scores = cross_val_score(model, X, y, cv=5, scoring="accuracy")
    print("5-fold CV Accuracy: %.3f +/- %.3f" % (cv_scores.mean(), cv_scores.std()))

    os.makedirs(MODEL_DIR, exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(ENCODER_PATH, "wb") as f:
        pickle.dump(le, f)

    print("\nModel saved to:", MODEL_PATH)
    print("Label encoder saved to:", ENCODER_PATH)

    # Feature importance
    importance = model.feature_importances_
    fi = sorted(zip(FEATURES, importance), key=lambda x: x[1], reverse=True)
    print("\nTop feature importances:")
    for feat, imp in fi[:8]:
        print("  %-20s %.4f" % (feat, imp))


if __name__ == "__main__":
    main()
