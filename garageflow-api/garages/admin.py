from django.contrib import admin

from .models import Garage


@admin.register(Garage)
class GarageAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'owner', 'is_active', 'created_at')
    search_fields = ('name', 'slug', 'owner__username', 'owner__email')
