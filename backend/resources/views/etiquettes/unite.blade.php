<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
    @page { margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: sans-serif; }
    .label {
        position: relative; width: 80mm; height: 40mm;
        border: 0.3mm solid #17262B; padding: 3mm 4mm;
    }
    .qr-box { position: absolute; top: 3mm; left: 4mm; width: 121px; height: 121px; overflow: hidden; }
    .infos { position: absolute; top: 3mm; left: 36mm; right: 4mm; }
    .org { font-size: 8pt; color: #5A676B; margin: 0 0 2mm; }
    .num { font-family: monospace; font-size: 11pt; font-weight: bold; color: #17262B; margin: 0 0 2mm; }
    .des { font-size: 8.5pt; color: #3D4A4E; line-height: 1.3; }
</style>
</head>
<body>
    <div class="label">
        <div class="qr-box">{!! $qr !!}</div>
        <div class="infos">
            <p class="org">UIYA &middot; Patrimoine</p>
            <p class="num">{{ $bien->numero_inventaire }}</p>
            <p class="des">{{ $bien->designation }}</p>
        </div>
    </div>
</body>
</html>
