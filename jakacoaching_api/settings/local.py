from .base import *
from .base import env

DEBUG = True

SECRET_KEY = env(
    "DJANGO_SECRET_KEY",
    default="django-insecure-cmkq!a%g-w80w6lglr1=5-(g#4ewncys&t!u_pz7m$genad)w=",
)

ALLOWED_HOSTS = ["localhost", "0.0.0.0", "127.0.0.1", "api"]