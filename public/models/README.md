Place the `sonics_model.onnx` file here.

To generate it, run the ONNX converter from the Spot-if-AI project:

```bash
cd ../Spot-if-AI/sonics-onnx-converter
pip install -r requirements.txt  # or use pyproject.toml
python convert_to_onnx.py
cp exports/sonics_model.onnx ../../goodbai-app/public/models/
```
