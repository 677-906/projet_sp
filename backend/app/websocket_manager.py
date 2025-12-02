"""
Gestionnaire WebSocket pour les notifications en temps réel
"""
from typing import Dict, Set
from fastapi import WebSocket
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        # Stocke les connexions par user_id
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        """Accepte une nouvelle connexion WebSocket pour un utilisateur"""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        print(f"✅ WebSocket connecté pour user_id={user_id}, total: {len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: int):
        """Déconnecte un WebSocket"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
            print(f"❌ WebSocket déconnecté pour user_id={user_id}")

    async def send_personal_notification(self, user_id: int, notification_data: dict):
        """Envoie une notification à un utilisateur spécifique"""
        if user_id in self.active_connections:
            dead_connections = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(notification_data)
                    print(f"📨 Notification envoyée à user_id={user_id}")
                except Exception as e:
                    print(f"❌ Erreur envoi WebSocket: {e}")
                    dead_connections.add(connection)

            # Nettoyer les connexions mortes
            for dead_conn in dead_connections:
                self.active_connections[user_id].discard(dead_conn)

    async def broadcast_to_users(self, user_ids: list, notification_data: dict):
        """Envoie une notification à plusieurs utilisateurs"""
        for user_id in user_ids:
            await self.send_personal_notification(user_id, notification_data)

# Instance globale
manager = ConnectionManager()
