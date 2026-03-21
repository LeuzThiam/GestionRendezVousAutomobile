from django.utils import timezone

from reprogrammations.models import ReprogrammationProposition


def get_pending_proposal(instance):
    proposals = instance.reprogrammation_propositions.all()
    for proposal in proposals:
        if proposal.response_status == 'pending':
            return proposal
    return None


def mark_pending_reschedules(instance, actor, response_status, note=''):
    now = timezone.now()
    updated = False
    for proposal in instance.reprogrammation_propositions.filter(response_status='pending'):
        proposal.response_status = response_status
        proposal.responded_at = now
        proposal.responded_by = actor
        if note and not proposal.internal_note:
            proposal.internal_note = note
        proposal.save(update_fields=['response_status', 'responded_at', 'responded_by', 'internal_note'])
        updated = True
    return updated


def create_reschedule_proposal(instance, actor, proposal_type, proposed_date, response_status='pending', note=''):
    now = timezone.now()
    payload = {
        'rendez_vous': instance,
        'proposed_date': proposed_date,
        'proposal_type': proposal_type,
        'created_by': actor,
        'internal_note': note or '',
        'response_status': response_status,
    }
    if response_status != 'pending':
        payload['responded_at'] = now
        payload['responded_by'] = actor
    return ReprogrammationProposition.objects.create(**payload)

