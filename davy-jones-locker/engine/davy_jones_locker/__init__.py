"""DAVY JONES' LOCKER's engine: runs flowgraphs on the server.

    from davy_jones_locker import create_app
    app = create_app()                    # or with the app's own node kinds:
    app = create_app(nodes=[...], categories=[...])   # see nodes.py

The runner (sandbox/) and the node worker (nodeworker/) import this package
too, without the engine's libraries, so nothing here imports them until
create_app is called.
"""


def create_app(*args, **kwargs):
    from .main import create_app as create
    return create(*args, **kwargs)
