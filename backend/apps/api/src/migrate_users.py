#!/usr/bin/env python3
"""
Migration script to convert existing workflows to use persistent users
"""
import os
import sys
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
DB_NAME = os.getenv("DB_NAME", "aiwf")

def get_db():
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]

def migrate_users_and_workflows():
    """Migrate existing workflows to use persistent users"""
    db = get_db()
    
    print("🔄 Starting user and workflow migration...")
    
    # Step 1: Find all unique email-based created_by values in workflows
    print("\n📋 Step 1: Finding existing email-based workflow creators...")
    
    pipeline = [
        {"$match": {"created_by": {"$regex": "^user_"}}},  # Match old format
        {"$group": {"_id": "$created_by"}},
        {"$sort": {"_id": 1}}
    ]
    
    creators = list(db.workflows.aggregate(pipeline))
    print(f"Found {len(creators)} unique creators to migrate")
    
    if len(creators) == 0:
        print("No workflows to migrate. All workflows already use ObjectId references.")
        return {}
    
    # Step 2: Create users for each unique creator
    print("\n👥 Step 2: Creating users in database...")
    
    user_mapping = {}  # Map old creator string to new user ObjectId
    
    for creator_doc in creators:
        old_creator = creator_doc["_id"]
        # Extract email from "user_email@example.com" format
        email = old_creator.replace("user_", "")
        
        print(f"  Creating user for: {email}")
        
        # Check if user already exists
        existing_user = db.users.find_one({"email": email})
        if existing_user:
            user_id = existing_user["_id"]
            print(f"    ✅ User already exists: {user_id}")
        else:
            # Create new user
            now = datetime.utcnow()
            user_data = {
                "email": email,
                "created_at": now,
                "updated_at": now,
                "last_login": now,
                "is_active": True,
                "role": "admin" if email == "test@example.com" else "user",
                "preferences": {},
                "profile": {}
            }
            
            result = db.users.insert_one(user_data)
            user_id = result.inserted_id
            print(f"    ✅ Created new user: {user_id}")
        
        user_mapping[old_creator] = str(user_id)
    
    # Step 3: Update all workflows to use new user ObjectIds
    print(f"\n🔄 Step 3: Updating workflows to reference user ObjectIds...")
    
    updated_count = 0
    for old_creator, new_user_id in user_mapping.items():
        result = db.workflows.update_many(
            {"created_by": old_creator},
            {"$set": {
                "created_by": new_user_id,
                "updated_at": datetime.utcnow()
            }}
        )
        
        print(f"  Updated {result.modified_count} workflows for {old_creator} -> {new_user_id}")
        updated_count += result.modified_count
    
    # Step 4: Update runs collection as well
    print(f"\n🔄 Step 4: Updating runs to reference user ObjectIds...")
    
    runs_updated = 0
    for old_creator, new_user_id in user_mapping.items():
        result = db.runs.update_many(
            {"created_by": old_creator},
            {"$set": {
                "created_by": new_user_id,
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.modified_count > 0:
            print(f"  Updated {result.modified_count} runs for {old_creator} -> {new_user_id}")
            runs_updated += result.modified_count
    
    # Step 5: Verification
    print(f"\n✅ Migration completed!")
    print(f"   - Created {len(user_mapping)} users")
    print(f"   - Updated {updated_count} workflows")
    print(f"   - Updated {runs_updated} runs")
    
    # Verify results
    print(f"\n🔍 Verification:")
    users_count = db.users.count_documents({})
    workflows_count = db.workflows.count_documents({"created_by": {"$not": {"$regex": "^user_"}}})
    old_workflows_count = db.workflows.count_documents({"created_by": {"$regex": "^user_"}})
    
    print(f"   - Total users in database: {users_count}")
    print(f"   - Workflows with ObjectId references: {workflows_count}")
    print(f"   - Workflows with old email references: {old_workflows_count}")
    
    if old_workflows_count == 0:
        print("   ✅ All workflows successfully migrated!")
    else:
        print("   ⚠️  Some workflows still have old references!")
    
    return user_mapping

def create_admin_user():
    """Create an admin user if it doesn't exist"""
    db = get_db()
    
    admin_email = "admin@aiwf.local"
    existing_admin = db.users.find_one({"email": admin_email})
    
    if not existing_admin:
        print(f"\n👑 Creating admin user: {admin_email}")
        now = datetime.utcnow()
        admin_data = {
            "email": admin_email,
            "created_at": now,
            "updated_at": now,
            "last_login": None,
            "is_active": True,
            "role": "admin",
            "preferences": {},
            "profile": {"name": "Administrator"}
        }
        
        result = db.users.insert_one(admin_data)
        print(f"   ✅ Admin user created: {result.inserted_id}")
        return str(result.inserted_id)
    else:
        print(f"   ℹ️  Admin user already exists: {existing_admin['_id']}")
        return str(existing_admin["_id"])

if __name__ == "__main__":
    try:
        # Run migrations
        user_mapping = migrate_users_and_workflows()
        admin_id = create_admin_user()
        
        print(f"\n🎉 Migration completed successfully!")
        print(f"\n💡 You can now:")
        print(f"   - Log in with any email to automatically create/access your user account")
        print(f"   - Use admin@aiwf.local for admin access")
        print(f"   - All existing workflows are now properly linked to persistent users")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1) 