from comptes.services import (
    assign_profile,
    create_basic_user,
    get_user_garage,
    get_user_profile,
    get_user_role,
    normalize_profile_role,
    update_user_and_profile,
)
from personnel.services import create_mecanicien_for_garage, list_mecaniciens_for_garage

__all__ = [
    'normalize_profile_role',
    'get_user_profile',
    'get_user_garage',
    'get_user_role',
    'create_basic_user',
    'update_user_and_profile',
    'assign_profile',
    'list_mecaniciens_for_garage',
    'create_mecanicien_for_garage',
]
