from .shared_broker import redis_broker

# The broker is already configured in shared_broker.py
# Just export it for use in other modules
__all__ = ['redis_broker']
