"""User model for the accounts app.

Extends AbstractUser to add profile fields needed by the app:
avatar, bio and a preferred language used to localise responses.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user with profile metadata."""

    class Language(models.TextChoices):
        ENGLISH = "en", "English"
        PERSIAN = "fa", "فارسی"

    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    bio = models.TextField(blank=True, default="")
    preferred_language = models.CharField(
        max_length=2, choices=Language.choices, default=Language.ENGLISH
    )
    # Users can keep their list private
    is_private = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self) -> str:
        return self.username
