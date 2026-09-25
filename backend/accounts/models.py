from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class AccountManager(BaseUserManager):
    def create_user(self, student_email, student_name='', password=None, **extra_fields):
        if not student_email:
            raise ValueError("Email is required")

        student_email = self.normalize_email(student_email)

        user = self.model(
            student_email=student_email,
            student_name=student_name,
            **extra_fields
        )

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, student_email, student_name='', password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(
            student_email=student_email,
            student_name=student_name,
            password=password,
            **extra_fields
        )


from django.utils import timezone


class Account(AbstractBaseUser, PermissionsMixin):
    student_name = models.CharField(max_length=100, blank=True)
    student_email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = AccountManager()

    USERNAME_FIELD = 'student_email'
    REQUIRED_FIELDS = ['student_name']

    @property
    def email(self):
        return self.student_email

    @email.setter
    def email(self, value):
        self.student_email = value

    @property
    def student_password(self):
        return self.password

    def __str__(self):
        return self.student_email