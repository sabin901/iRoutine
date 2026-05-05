"""Root conftest — ensures `backend/` is on sys.path so `import app` works."""

import os
import sys

# Add the backend directory to Python's module search path
sys.path.insert(0, os.path.dirname(__file__))
