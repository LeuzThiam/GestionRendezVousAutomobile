from rest_framework.permissions import BasePermission

from comptes.services import get_user_garage, get_user_role


class IsGarageOwner(BasePermission):
    message = "Seul le proprietaire du garage peut effectuer cette action."

    def has_permission(self, request, view):
        return get_user_role(request.user) == 'owner' and get_user_garage(request.user) is not None

