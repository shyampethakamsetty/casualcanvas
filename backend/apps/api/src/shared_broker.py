import os
import dramatiq
from dramatiq.brokers.redis import RedisBroker
from dramatiq.middleware import Retries, AgeLimit

# Create Redis broker
redis_broker = RedisBroker(url=os.getenv("REDIS_URL", "redis://redis:6379/0"))

# Add middleware only once
redis_broker.add_middleware(Retries(retry_when=lambda m, e: True, max_retries=3))
redis_broker.add_middleware(AgeLimit(max_age=60*60))

# Set as the default broker
dramatiq.set_broker(redis_broker)

# Export the broker for use in other modules
__all__ = ['redis_broker'] 