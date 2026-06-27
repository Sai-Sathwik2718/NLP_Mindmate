import sys
import os

# Add root project folder to python path so backend package is importable in serverless environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app
