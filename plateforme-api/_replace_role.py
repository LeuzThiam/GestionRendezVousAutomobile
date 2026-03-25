import pathlib

replacements = [
    ("profile__role='mecanicien'", "profile__role='employe'"),
    ("role='mecanicien'", "role='employe'"),
    ("role == 'mecanicien'", "role == 'employe'"),
    ("role != 'mecanicien'", "role != 'employe'"),
    ("in {'mecanicien', 'owner'}", "in {'employe', 'owner'}"),
    ("in {'owner', 'mecanicien'}", "in {'owner', 'employe'}"),
    ("{'owner', 'mecanicien'}", "{'owner', 'employe'}"),
    ("{'mecanicien', 'owner'}", "{'employe', 'owner'}"),
]

root = pathlib.Path('.')
for p in root.rglob('*.py'):
    if '_replace_role.py' in str(p):
        continue
    if 'migrations' in p.parts and p.name == '0001_initial.py':
        continue
    t = p.read_text(encoding='utf-8')
    n = t
    for a, b in replacements:
        n = n.replace(a, b)
    if n != t:
        p.write_text(n, encoding='utf-8')
        print(p)
