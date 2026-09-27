"""DAVY JONES' LOCKER's engine: runs flowgraphs on the server.

    from davy_jones_locker import create_app
    app = create_app()

The runner (sandbox/) imports this package too, without the engine's
libraries, so nothing here imports them until create_app is called.
"""


def create_app(*args, **kwargs):
    from .main import create_app as create
    return create(*args, **kwargs)
