"""Stylized travel miniatures. Millimetres, Z up; front faces -Y (+Z in glTF)."""
import build123d as bd
from cad import model

GREEN, SAND, PAPER, GLASS, RUBBER = '#245e50', '#d9b66f', '#f4f1e9', '#25443f', '#253b34'


def part(shape, label, color, position=(0, 0, 0)):
    shape = bd.Pos(*position) * shape
    shape.label, shape.color = label, color
    return shape


@model
def bus():
    body = bd.Box(1100, 2700, 950)
    body = bd.fillet(body.edges(), 100)
    parts = [part(body, 'coach_body', SAND, (0, 0, 0)),
             part(bd.Box(1120, 2300, 130), 'lower_livery', GREEN, (0, 0, -300)),
             part(bd.Box(820, 25, 400), 'windshield', GLASS, (0, -1340, 180)),
             part(bd.Box(800, 25, 300), 'rear_window', GLASS, (0, 1340, 180)),
             part(bd.Box(800, 900, 80), 'roof_vent', PAPER, (0, 150, 500))]
    for side in (-1, 1):
        for y in (-850, -300, 250, 800):
            parts.append(part(bd.Box(25, 450, 360), 'passenger_window', GLASS, (side*550, y, 180)))
        for y in (-850, 850):
            parts.append(part(bd.Cylinder(240, 150, rotation=(0, 90, 0)), 'tyre', RUBBER, (side*520, y, -480)))
            parts.append(part(bd.Cylinder(110, 155, rotation=(0, 90, 0)), 'hub', PAPER, (side*525, y, -480)))
        parts.append(part(bd.Box(100, 150, 200), 'mirror', GREEN, (side*620, -1190, 180)))
        parts.append(part(bd.Box(180, 30, 95), 'headlamp', PAPER, (side*310, -1350, -260)))
        parts.append(part(bd.Box(120, 30, 100), 'tail_lamp', '#ad6852', (side*350, 1350, -260)))
    return bd.Compound(children=parts, label='kkl_coach')


@model
def ferry():
    outline = bd.Polygon((-800, 1700), (800, 1700), (900, -1000),
                         (450, -1850), (0, -2100), (-450, -1850), (-900, -1000), align=None)
    hull = bd.extrude(outline, amount=400, dir=(0, 0, 1))
    parts = [part(hull, 'hull', GREEN, (0, 0, -200)),
             part(bd.Box(1450, 2600, 100), 'deck', SAND, (0, 0, 250)),
             part(bd.Box(1150, 1550, 550), 'cabin', PAPER, (0, 200, 570)),
             part(bd.Box(1250, 1650, 90), 'cabin_roof', SAND, (0, 200, 890)),
             part(bd.Box(850, 650, 320), 'bridge', PAPER, (0, -120, 1095)),
             part(bd.Box(720, 25, 190), 'bridge_glass', GLASS, (0, -450, 1110)),
             part(bd.Box(950, 750, 70), 'bridge_roof', GREEN, (0, -120, 1290)),
             part(bd.Box(280, 350, 350), 'funnel', GREEN, (0, 650, 1100))]
    for side in (-1, 1):
        for y in (-300, 200, 700):
            parts.append(part(bd.Box(25, 320, 230), 'cabin_window', GLASS, (side*580, y, 620)))
        parts.append(part(bd.Box(45, 2500, 45), 'handrail', PAPER, (side*700, 0, 560)))
        for y in (-1200, -400, 400, 1200):
            parts.append(part(bd.Box(40, 40, 280), 'rail_post', PAPER, (side*700, y, 420)))
    return bd.Compound(children=parts, label='kkl_ferry')


if __name__ == '__main__':
    bus()
    ferry()
