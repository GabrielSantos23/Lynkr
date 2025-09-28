import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import secrets
import re
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class EncryptionService:
    def __init__(self):
        self.key = None
        self._init_key()
    
    def _init_key(self):
        """Initialize the encryption key from environment variable"""
        base64_key = os.getenv("ENCRYPTION_KEY")
        if not base64_key:
            raise ValueError("ENCRYPTION_KEY environment variable is missing")
        
        # Decode base64 key to bytes
        self.key = base64.b64decode(base64_key)
    
    def _looks_like_plaintext(self, text: str) -> bool:
        """Check if text looks like plaintext (printable ASCII characters)"""
        printable_pattern = re.compile(r'^[\x20-\x7E\s]+$')
        return bool(printable_pattern.match(text)) and len(text) > 0
    
    def _try_extract_plaintext(self, data: str) -> str:
        """Try to extract plaintext from potentially encoded data"""
        if self._looks_like_plaintext(data):
            return data
        
        try:
            decoded = base64.b64decode(data).decode('utf-8')
            if self._looks_like_plaintext(decoded):
                return decoded
        except:
            pass
        
        return data
    
    def encrypt(self, plaintext: str) -> str:
        """Encrypt plaintext using AES-GCM"""
        if not self.key:
            raise ValueError("Encryption key not initialized")
        
        # Generate random IV (12 bytes for GCM)
        iv = secrets.token_bytes(12)
        
        # Create AES-GCM cipher
        aesgcm = AESGCM(self.key)
        
        # Encrypt the data
        ciphertext = aesgcm.encrypt(iv, plaintext.encode('utf-8'), None)
        
        # Combine IV and ciphertext
        combined = iv + ciphertext
        
        # Add version byte (0x01) at the beginning
        versioned_combined = b'\x01' + combined
        
        # Encode to base64
        return base64.b64encode(versioned_combined).decode('utf-8')
    
    def decrypt(self, ciphertext_base64: str) -> str:
        """Decrypt ciphertext using AES-GCM"""
        if not self.key:
            raise ValueError("Encryption key not initialized")
        
        try:
            # Decode base64
            try:
                combined = base64.b64decode(ciphertext_base64)
            except:
                return ciphertext_base64
            
            # Check version byte
            if len(combined) > 0 and combined[0] == 0x01:
                # Remove version byte
                data_without_version = combined[1:]
                
                # Extract IV and ciphertext
                iv = data_without_version[:12]
                ciphertext = data_without_version[12:]
                
                # Create AES-GCM cipher and decrypt
                aesgcm = AESGCM(self.key)
                decrypted = aesgcm.decrypt(iv, ciphertext, None)
                
                return decrypted.decode('utf-8')
            else:
                return self._try_extract_plaintext(ciphertext_base64)
        
        except Exception as e:
            print(f"Decryption failed: {e}")
            return self._try_extract_plaintext(ciphertext_base64)

# Global encryption service instance
encryption_service = EncryptionService()
