import requests
import json
from typing import Optional
import os

FCM_API_KEY = os.getenv("FCM_API_KEY")
FCM_SEND_URL = "https://fcm.googleapis.com/fcm/send"

def send_fcm_notification(token: str, title: str, body: str, data: Optional[dict] = None):
    if not FCM_API_KEY:
        print("FCM_API_KEY not configured. Skipping notification.")
        return
    if not token:
        print("No FCM token provided, skipping notification.")
        return

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"key={FCM_API_KEY}",
    }

    notification_payload = {
        "to": token,
        "notification": {
            "title": title,
            "body": body,
        },
        "data": data or {},
    }

    try:
        response = requests.post(FCM_SEND_URL, headers=headers, data=json.dumps(notification_payload))
        response.raise_for_status()  # Raise an exception for bad status codes
        print(f"Successfully sent notification: {response.json()}")
    except requests.exceptions.RequestException as e:
        print(f"Error sending FCM notification: {e}")