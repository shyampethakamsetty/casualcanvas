import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from typing import Optional

class Database:
    client: Optional[AsyncIOMotorClient] = None
    sync_client: Optional[MongoClient] = None

    @classmethod
    async def connect_db(cls):
        """Create database connection"""
        mongo_url = os.getenv("MONGO_URL", "mongodb://mongo:27017/aiwf")
        cls.client = AsyncIOMotorClient(mongo_url)
        cls.sync_client = MongoClient(mongo_url)
        
        # Test connection
        await cls.client.admin.command('ping')
        print("✅ Connected to MongoDB")

    @classmethod
    async def close_db(cls):
        """Close database connection"""
        if cls.client:
            cls.client.close()
        if cls.sync_client:
            cls.sync_client.close()

    @classmethod
    def get_db(cls):
        """Get database instance"""
        if not cls.client:
            raise RuntimeError("Database not connected. Call connect_db() first.")
        return cls.client.aiwf

    @classmethod
    def get_sync_db(cls):
        """Get synchronous database instance"""
        if not cls.sync_client:
            raise RuntimeError("Database not connected. Call connect_db() first.")
        return cls.sync_client.aiwf

# Database collections
def get_workflows_collection():
    """Get workflows collection"""
    return Database.get_db().workflows

def get_runs_collection():
    """Get runs collection"""
    return Database.get_db().runs

def get_users_collection():
    """Get users collection"""
    return Database.get_db().users 