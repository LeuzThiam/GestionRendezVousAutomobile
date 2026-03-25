from rest_framework.permissions import BasePermission


class IsClientForCreate(BasePermission):
    message = "Seul un client peut creer un rendez-vous."

    def has_permission(self, request, view):
        if request.method != 'POST':
            return True
        profile = getattr(request.user, 'profile', None)
        return getattr(profile, 'role', None) == 'client'
