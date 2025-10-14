from exponent_server_sdk import (
    DeviceNotRegisteredError,
    PushClient,
    PushMessage,
    PushServerError,
)
from requests.exceptions import ConnectionError, HTTPError

def send_push_message(token: str, title: str, message: str, extra: dict = None):
    """
    Sends a push notification to a specific token.
    """
    if not token:
        print("No push token provided, skipping notification.")
        return

    try:
        response = PushClient().publish(
            PushMessage(to=token, title=title, body=message, data=extra)
        )
    except PushServerError as exc:
        print(f"Push server error: {exc}")
    except (ConnectionError, HTTPError) as exc:
        print(f"Connection error: {exc}")

    try:
        response.validate_response()
    except DeviceNotRegisteredError:
        print(f"Device not registered for push notifications: {token}")
    except Exception as exc:
        print(f"An unexpected error occurred: {exc}")