#!/usr/bin/python

source_of_truth = "en-US/core.json"
locales_dir = "locales"
locales = ['tr-TR', 'lt-LT', 'ku-IQ', 'sq-AL', 'fr-FR', 'de-DE', 'fa-AF', 'pl-PL', 'vi-VN', 'da-DK', 'no-NO', 'el-GR', 'nn-NO', 'es-ES', 'haw-HI', 'tg-TJ', 'ru-RU', 'is-IS', 'ca-ES', 'ps-AF', 'lv-LV', 'es-AR', 'mr-IN', 'es-MX', 'et-EE', 'si-LK', 'ar-SA', 'ga-IE', 'en-GB', 'bs-BA', 'hu-HU', 'nl-NL', 'hy-AM', 'se-FI', 'uz-UZ', 'zu-ZA', 'km-KH', 'ms-MY', 'mk-MK', 'ja-JP', 'zh-CN', 'ro-RO', 'hi-IN', 'sl-SI', 'co-CO', 'he-IL', 'cs-CZ', 'hr-HR', 'pt-PT', 'zh-TW', 'ko-KR', 'pt-BR', 'kk-KZ', 'it-IT', 'id-ID', 'ta-IN', 'th-TH', 'mi-NZ', 'az-AZ', 'sv-SE', 'gl-ES', 'te-IN', 'sr-SP', 'en-US', 'bn-BD', 'uk-UA', 'my-MM', 'ne-NP', 'sk-SK', 'ky-KG', 'fil-PH', 'ur-PK', 'eu-ES', 'ka-GE', 'fi-FI', 'bg-BG', 'fa-IR', 'mt-MT']
# locales = ['ar-SA']

for locale in locales:
    path = "%s/%s/core.json" % (locales_dir, locale)
    lines = open(path, 'r').readlines()

    with open(path, 'w') as output:
        done = False
        for line in lines:
            segments = line.split('"')
            if (len(segments) > 1 and segments[1] > "CONTROLS_FOR_HELPURL" and not done):
                output.write('  "CONTROLS_FOR_INPUT_COUNTER": "for %1 from %2 to %3 count by %4",\n')
                done = True
            output.write(line)