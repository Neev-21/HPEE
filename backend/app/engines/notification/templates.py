"""
Multilingual Alert Templates — templates.py
---------------------------------------------
Localized message templates in Gujarati, Hindi, and English for
citizen WhatsApp/SMS alerts and regulatory dispatches.
"""

from typing import Dict, Tuple

TEMPLATES: Dict[str, Dict[str, str]] = {
    "gu": {
        "title": "🚨 HPEE ચેતવણી: {village_name} માં તીવ્ર ઔદ્યોગિક વાયુ પ્રદૂષણ નોંધાયું",
        "body": (
            "નમસ્તે {recipient_name},\n\n"
            "HPEE સેન્સર દ્વારા {village_name} માં અસામાન્ય વાયુ પ્રદૂષણ નોંધાયું છે:\n"
            "• PM2.5 સ્તર: {peak_pm25:.1f} µg/m³\n"
            "• SO2 સ્તર: {peak_so2:.1f} ppb\n"
            "• શંકાસ્પદ સ્ત્રોત: {culprit_name} ({confidence_percent:.0f}% સંભાવના)\n"
            "• પવનની દિશા: {wind_direction:.0f}° થી પ્રવાહ\n\n"
            "GSPCB ફોર્મ-A કાનૂની ફરિયાદ તૈયાર છે.\n"
            "લાઈવ નકશો અને વિગતો જોવા માટે ક્લિક કરો:\n"
            "{action_url}"
        ),
    },
    "hi": {
        "title": "🚨 HPEE चेतावनी: {village_name} में गंभीर औद्योगिक प्रदूषण दर्ज",
        "body": (
            "नमस्ते {recipient_name},\n\n"
            "HPEE सेंसर द्वारा {village_name} क्षेत्र में हानिकारक रासायनिक उत्सर्जन पाया गया है:\n"
            "• PM2.5 स्तर: {peak_pm25:.1f} µg/m³\n"
            "• SO2 स्तर: {peak_so2:.1f} ppb\n"
            "• संभावित स्रोत: {culprit_name} ({confidence_percent:.0f}% संभावना)\n"
            "• पवन दिशा: {wind_direction:.0f}°\n\n"
            "GSPCB फॉर्म-A कानूनी शिकायत ड्राफ्ट तैयार है।\n"
            "प्रमाण और नक्शा देखने के लिए लिंक खोलें:\n"
            "{action_url}"
        ),
    },
    "en": {
        "title": "🚨 HPEE Alert: Severe Industrial Emission Spike in {village_name}",
        "body": (
            "Hello {recipient_name},\n\n"
            "HPEE automated monitoring detected an industrial emission surge in {village_name}:\n"
            "• Peak PM2.5: {peak_pm25:.1f} µg/m³\n"
            "• Peak SO2: {peak_so2:.1f} ppb\n"
            "• Top Culprit: {culprit_name} ({confidence_percent:.0f}% confidence)\n"
            "• Wind Vector: {wind_direction:.0f}°\n\n"
            "Pre-filled GSPCB Form-A legal complaint dossier is generated.\n"
            "View live evidence map and sign:\n"
            "{action_url}"
        ),
    },
}


def render_alert_message(
    lang: str,
    village_name: str,
    recipient_name: str,
    peak_pm25: float,
    peak_so2: float,
    culprit_name: str,
    confidence_percent: float,
    wind_direction: float,
    action_url: str,
) -> Tuple[str, str]:
    """
    Renders localized (title, body) text for the given language.
    Falls back to Gujarati ('gu') if language is not supported.
    """
    selected_lang = lang.lower() if lang.lower() in TEMPLATES else "gu"
    tmpl = TEMPLATES[selected_lang]

    context = {
        "village_name": village_name or "Ankleshwar",
        "recipient_name": recipient_name or "Citizen",
        "peak_pm25": peak_pm25 or 0.0,
        "peak_so2": peak_so2 or 0.0,
        "culprit_name": culprit_name or "Unknown Industrial Facility",
        "confidence_percent": confidence_percent or 85.0,
        "wind_direction": wind_direction or 135.0,
        "action_url": action_url,
    }

    title = tmpl["title"].format(**context)
    body = tmpl["body"].format(**context)
    return title, body
