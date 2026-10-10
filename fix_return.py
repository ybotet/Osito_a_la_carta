with open('C:/Users/ybotet/Documentos/Programación/Osito_a_la_carta/client/src/pages/admin/OrderDetail.tsx', 'rb') as f:
    content = f.read()

old = b'}, [order]);\n    <main className="mx-auto max-w-3xl p-4">'
new = b'}, [order]);\n  return (\n    <main className="mx-auto max-w-3xl p-4">'

if old in content:
    content = content.replace(old, new)
    with open('C:/Users/ybotet/Documentos/Programación/Osito_a_la_carta/client/src/pages/admin/OrderDetail.tsx', 'wb') as f:
        f.write(content)
    print('Replaced successfully')
else:
    print('Pattern not found')