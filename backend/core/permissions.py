from rest_framework.permissions import BasePermission
from debates.models import Participation

class IsSessionModerator(BasePermission):
    """
    Allows access only to the moderator of the session.
    """
    def has_object_permission(self, request, view, obj):
        return obj.moderator == request.user

class CanPostMessage(BasePermission):
    """
    Allows users to post messages only if they are participants and not muted.
    """
    def has_permission(self, request, view):
        session_pk = request.query_params.get('session_pk')
        if not session_pk:
            return False
        
        try:
            participation = Participation.objects.get(session_id=session_pk, user=request.user)
            return not participation.is_muted
        except Participation.DoesNotExist:
            return False 