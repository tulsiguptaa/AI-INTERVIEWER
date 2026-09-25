"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect


def social_login_cancelled_redirect(request):
    return redirect('http://localhost:5173/?login=cancelled')


def social_login_error_redirect(request):
    return redirect('http://localhost:5173/?login=error')


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('accounts/social/login/cancelled/', social_login_cancelled_redirect),
    path('accounts/social/login/error/', social_login_error_redirect),
    path('accounts/', include('allauth.urls')),
]
