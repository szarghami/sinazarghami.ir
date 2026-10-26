from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from marshmallow import fields, ValidationError
from werkzeug.security import generate_password_hash, check_password_hash

# ایجاد برنامه Flask
app = Flask(__name__)
# پیکربندی پایگاه داده
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///content_models.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# ایجاد شیء SQLAlchemy
db = SQLAlchemy(app)
# ایجاد شیء Marshmallow
ma = Marshmallow(app)

# مدل محتوا
class ContentModel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    def __init__(self, title, description):
        self.title = title
        self.description = description

# اسکیما Marshmallow برای مدل محتوا
class ContentModelSchema(ma.Schema):
    id = fields.Integer(dump_only=True)
    title = fields.String(required=True)
    description = fields.String()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

# ایجاد شیء اسکیما
content_schema = ContentModelSchema()
contents_schema = ContentModelSchema(many=True)

# ایجاد جداول پایگاه داده
with app.app_context():
    db.create_all()

# هندلر برای ایجاد مدل محتوا
@app.route('/content_models', methods=['POST'])
def add_content_model():
    try:
        content_data = content_schema.load(request.json)
    except ValidationError as err:
        return jsonify(err.messages), 400

    new_content = ContentModel(title=content_data['title'], description=content_data['description'])
    db.session.add(new_content)
    db.session.commit()

    return content_schema.jsonify(new_content), 201

# هندلر برای دریافت همه مدل‌های محتوا
@app.route('/content_models', methods=['GET'])
def get_content_models():
    all_contents = ContentModel.query.all()
    result = contents_schema.dump(all_contents)
    return jsonify(result)

# هندلر برای دریافت یک مدل محتوا
@app.route('/content_models/<int:id>', methods=['GET'])
def get_content_model(id):
    content = ContentModel.query.get_or_404(id)
    return content_schema.jsonify(content)

# هندلر برای به روزرسانی مدل محتوا
@app.route('/content_models/<int:id>', methods=['PUT'])
def update_content_model(id):
    content = ContentModel.query.get_or_404(id)

    try:
        content_data = content_schema.load(request.json)
    except ValidationError as err:
        return jsonify(err.messages), 400

    content.title = content_data['title']
    content.description = content_data['description']

    db.session.commit()

    return content_schema.jsonify(content)

# هندلر برای حذف مدل محتوا
@app.route('/content_models/<int:id>', methods=['DELETE'])
def delete_content_model(id):
    content = ContentModel.query.get_or_404(id)
    db.session.delete(content)
    db.session.commit()

    return content_schema.jsonify(content)

if __name__ == '__main__':
    app.run(debug=True)
