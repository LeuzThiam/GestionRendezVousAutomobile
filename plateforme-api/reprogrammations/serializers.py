from rest_framework import serializers

from reprogrammations.models import ReprogrammationProposition


class ReprogrammationPropositionSerializer(serializers.ModelSerializer):
    proposal_type_label = serializers.CharField(source='get_proposal_type_display', read_only=True)
    response_status_label = serializers.CharField(source='get_response_status_display', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    responded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ReprogrammationProposition
        fields = [
            'id',
            'proposal_type',
            'proposal_type_label',
            'proposed_date',
            'created_at',
            'created_by_name',
            'response_status',
            'response_status_label',
            'responded_at',
            'responded_by_name',
            'internal_note',
        ]

    def _format_actor_name(self, user):
        if not user:
            return None
        full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
        return full_name or user.username

    def get_created_by_name(self, obj):
        return self._format_actor_name(obj.created_by)

    def get_responded_by_name(self, obj):
        return self._format_actor_name(obj.responded_by)

    def to_representation(self, instance):
        payload = super().to_representation(instance)
        if not self.context.get('include_internal_notes'):
            payload.pop('internal_note', None)
        return payload

