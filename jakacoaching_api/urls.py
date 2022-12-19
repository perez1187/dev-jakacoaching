from django.conf import settings
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path(settings.ADMIN_URL, admin.site.urls), # settings.base.py
]

admin.site.site_header = "JakaCoaching API Admin"
admin.site.site_title = "JakaCoaching API Admin Portal"
admin.site.index_title = "Welcome to the JakaCoaching API Portal"