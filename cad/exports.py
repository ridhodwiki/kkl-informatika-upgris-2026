from pathlib import Path
from cad import export
from vehicles import bus, ferry

if __name__ == '__main__':
    destination = Path(__file__).resolve().parents[1] / 'public/assets/models'
    export(bus(), destination / 'kkl-bus.glb')
    export(ferry(), destination / 'kkl-ferry.glb')
