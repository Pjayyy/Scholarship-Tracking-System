import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
import joblib

# SAMPLE DATA (you can expand later from MySQL export)
data = {
    "gpa": [3.5, 3.0, 2.8, 2.0, 1.8, 2.2, 3.7, 1.5],
    "attendance": [95, 90, 85, 70, 60, 80, 98, 50],
    "risk": [0, 0, 0, 1, 1, 1, 0, 1]  # 0=SAFE, 1=AT RISK
}

df = pd.DataFrame(data)

X = df[["gpa", "attendance"]]
y = df["risk"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

model = LogisticRegression()
model.fit(X_train, y_train)

joblib.dump(model, "risk_model.pkl")

print("AI Model trained and saved!")