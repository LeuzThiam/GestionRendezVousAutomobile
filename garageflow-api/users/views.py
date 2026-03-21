from comptes.auth_views import (
    AuthClientRegisterView,
    AuthLoginView,
    AuthLogoutView,
    AuthMeView,
    AuthOwnerRegisterView,
    AuthRegisterView,
    MyTokenObtainPairView,
)
from comptes.views import (
    UserDetailView,
    UserProfileUpdateView,
    UserProfileView,
    UserRegistrationView,
)
from personnel.views import (
    MecanicienDetailView,
    MecanicienDisponibiliteDetailView,
    MecanicienDisponibiliteListCreateView,
    MecanicienListView,
    MecanicienManagementView,
)

__all__ = [
    'AuthRegisterView',
    'AuthOwnerRegisterView',
    'AuthClientRegisterView',
    'AuthLoginView',
    'AuthLogoutView',
    'AuthMeView',
    'MyTokenObtainPairView',
    'UserRegistrationView',
    'UserProfileView',
    'UserProfileUpdateView',
    'UserDetailView',
    'MecanicienListView',
    'MecanicienManagementView',
    'MecanicienDetailView',
    'MecanicienDisponibiliteListCreateView',
    'MecanicienDisponibiliteDetailView',
]
