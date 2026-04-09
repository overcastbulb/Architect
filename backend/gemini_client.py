"""
Backward-compatible shim.
Use llm_client.interpret_prompt (Groq-only implementation).
"""

from llm_client import interpret_prompt

__all__ = ["interpret_prompt"]
