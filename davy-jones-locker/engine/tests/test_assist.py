"""The AI assistant's prompt: what it's told scripts can import."""

from davy_jones_locker import assist, settings


def test_the_assistant_reads_an_apps_runner_libraries(tmp_path, monkeypatch):
    assert "GeoDataFrame" not in assist.system_prompt("python-script", False)  # the framework's runner has no geopandas
    packages = tmp_path / "requirements.in"
    packages.write_text("# The server\nfastapi==1\n\n# Libraries scripts can import\npandas==3\ngeopandas==1.2.0\n")
    monkeypatch.setattr(settings, "RUNNER_PACKAGES_FILE", str(packages))
    assert assist.python_libraries() == ["pandas", "geopandas"]
    assert "GeoDataFrame" in assist.system_prompt("python-script", False)
