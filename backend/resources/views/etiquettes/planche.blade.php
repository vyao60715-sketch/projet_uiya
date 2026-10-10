<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
    @page { margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: sans-serif; }
    .label {
        position: relative; width: 85mm; height: 40mm; float: left;
        border: 0.3mm solid #17262B; padding: 3mm 4mm; margin: 0 2mm 2mm 0;
        page-break-inside: avoid;
    }
    .qr-box { position: absolute; top: 3mm; left: 4mm; width: 121px; height: 121px; overflow: hidden; }
    .infos { position: absolute; top: 3mm; left: 36mm; right: 4mm; }
    .org { font-size: 8pt; color: #5A676B; margin: 0 0 2mm; }
    .num { font-family: monospace; font-size: 11pt; font-weight: bold; color: #17262B; margin: 0 0 2mm; }
    .des { font-size: 8.5pt; color: #3D4A4E; line-height: 1.3; }
</style>
</head>
<body>
    @foreach ($biens as $item)
        <div class="label">
            <div class="qr-box">{!! $item['qr'] !!}</div>
            <div class="infos">
                <p class="org">UIYA &middot; Patrimoine</p>
                <p class="num">{{ $item['bien']->numero_inventaire }}</p>
                <p class="des">{{ $item['bien']->designation }}</p>
            </div>
        </div>
    @endforeach
</body>
</html>
