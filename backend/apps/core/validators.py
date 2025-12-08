"""
Custom validators for the application
"""
import re
from django.core.exceptions import ValidationError


def validate_international_phone(value):
    """
    Validates that a phone number is in international format: +XXX XXXXXXXXX
    Accepts formats like:
    - +243 123456789
    - +243123456789
    - +1 2345678901
    """
    if not value:
        return value

    # Remove spaces for validation
    cleaned = value.replace(' ', '').replace('-', '')

    # Must start with +
    if not cleaned.startswith('+'):
        raise ValidationError(
            'Le numéro de téléphone doit commencer par + suivi de l\'indicatif pays.'
        )

    # Must have at least + and country code (1-3 digits) and number (4-15 digits)
    # Total: +XXX XXXX... (minimum 6 chars, maximum 16 chars after cleanup)
    if len(cleaned) < 6 or len(cleaned) > 16:
        raise ValidationError(
            'Le numéro de téléphone doit contenir entre 6 et 16 chiffres (incluant l\'indicatif pays).'
        )

    # Check that after +, we only have digits
    if not cleaned[1:].isdigit():
        raise ValidationError(
            'Le numéro de téléphone ne doit contenir que des chiffres après le +.'
        )

    return value


def normalize_phone_number(value):
    """
    Normalizes a phone number to international format.
    Returns format: +XXX XXXXXXXXX
    """
    if not value:
        return value

    # Remove all spaces and dashes
    cleaned = value.replace(' ', '').replace('-', '')

    # If doesn't start with +, assume it's a local number and add default country code
    if not cleaned.startswith('+'):
        # Default to DRC (+243) if no country code
        cleaned = '+243' + cleaned

    # Extract country code and number
    # Country codes can be 1-3 digits
    match = re.match(r'^\+(\d{1,3})(\d+)$', cleaned)
    if match:
        country_code = match.group(1)
        number = match.group(2)

        # Format: +XXX XXXXXXXXX
        return f'+{country_code} {number}'

    return value


def validate_national_phone_length(national_number, max_length=15):
    """
    Validates that the national part of a phone number doesn't exceed max_length.
    national_number should be the number without country code.
    """
    if len(national_number) > max_length:
        raise ValidationError(
            f'Le numéro national ne doit pas dépasser {max_length} chiffres.'
        )
    return True
