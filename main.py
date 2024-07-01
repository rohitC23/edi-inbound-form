import os
from flask_cors import CORS
from flask import Flask, request, jsonify
import pandas as pd
import csv
import json
import docx

app = Flask(__name__)
CORS(app)


def csv_json(csv_file,json_file):

    headers = ['Id', 'X12 Node name', 'X12 Comments', 'Canonical Node name', 'Canonical Comments']
    final_csv_file = f'{csv_file.split(".")[0]}_0.csv'

    i = 0
    with open(csv_file, newline='') as in_file, open(final_csv_file, 'w', newline='') as out_file:
        reader = csv.reader(in_file)
        for row in reader:
            if row[2] != '' and row[3] != '' or row[4] != '':
                row[1] = f'Is {row[1]} code is coming from?'
                # row[2] = row[2] + ',None'
                i += 1
            writer = csv.writer(out_file)
            writer.writerow(row)

    with open(final_csv_file) as csvfile:
        reader = csv.DictReader(csvfile, fieldnames=headers)
        data = [row for row in reader]

    with open(json_file, 'w') as jsonfile:
        json.dump(data, jsonfile)

    with open(json_file, "r") as json_file:
        json_data = json.load(json_file)
        for item in json_data:
            if 'X12 Comments' in item:
                item['X12 Comments'] = item['X12 Comments'].split(',')

    ordered_data = []
    for item in json_data:
        ordered_item = {
            'Id': item['Id'],
            'X12 Node name': item['X12 Node name'],
            'X12 Comments': item['X12 Comments'],
            'Canonical Node name': item['Canonical Node name'],
            'Canonical Comments': item['Canonical Comments']
        }
        ordered_data.append(ordered_item)

    # Convert the ordered data to a JSON string
    response_data = json.dumps(ordered_data, indent=4)

    return response_data

def doc_csv(doc_file):

    file_name = os.path.basename(doc_file).split('.')[0]
    csvFilePath = f'{file_name}.csv'
    document = docx.Document(doc_file)
    tables = []

    for table_index, table in enumerate(document.tables):
        table_data = []
        for row in table.rows:
            row_data = [cell.text.strip() for cell in row.cells]
            table_data.append(row_data)
        # Create a pandas DataFrame from table_data
        df = pd.DataFrame(table_data[1:], columns=table_data[0])  # Use first row as headers
        tables.append(df)
        df.to_csv(csvFilePath, index=False)

    def new_csv_file(file_name, rows):
        with open(file_name, 'w', newline='') as out_file:
            writer = csv.writer(out_file)
            for row in rows:
                writer.writerow(row)

    file_list = ['dummy.csv','general.csv', 'equipment.csv', 'load_reference.csv', 'stop.csv']
    i = 0

    with open(csvFilePath, newline='') as in_file:
        reader = csv.reader(in_file)
        rows = []
        for row in reader:
            if row[2] == '' and row[3] == '' and row[4] == '' and rows:
                new_csv_file(file_list[i], rows)
                rows = []
                i += 1
                if i > len(file_list):
                    break
            else:
                rows.append(row)

        if rows and i < len(file_list):
            new_csv_file(file_list[i], rows)

    with open('file_name.txt', 'w') as f:
        f.write(file_name)

    return file_name


@app.route('/default/file', methods=['post'])
def default_file():
    try:
        doc_file = 'EDI_204_def.docx'
        result = doc_csv(doc_file)
        return jsonify({"uploaded_filename": result})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/upload/file',methods=['post'])
def upload_file():
    doc_file = request.files['file']
    try:
        doc_file_path = os.path.join(os.getcwd(),doc_file.filename)
        doc_file.save(doc_file_path)
        result = doc_csv(doc_file_path)
        return jsonify({"uploaded_filename": result})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# I think i may need to call the same fun like others
# api to get the general in json string
@app.route('/general', methods=['get'])
def display_general():

    csv_file = 'general.csv'
    json_file = 'general.json'
    json_data = csv_json(csv_file, json_file)
    return json_data


# api to get the contact in json string
@app.route('/load/references',methods=['get'])
def display_load_references():

    csv_file = 'load_reference.csv'
    json_file = 'load_reference.json'
    json_data = csv_json(csv_file, json_file)
    return json_data


# api to get the equipment in json string
@app.route('/equipment', methods=['get'])
def display_equipment():

    csv_file = 'equipment.csv'
    json_file = 'equipment.json'
    json_data = csv_json(csv_file, json_file)
    return json_data


# api to get the details in json string
@app.route('/stop', methods=['get'])
def display_stop():

    csv_file = 'stop.csv'
    json_file = 'stop.json'
    json_data = csv_json(csv_file, json_file)
    return json_data


@app.route('/summary',methods=['post'])
def generate_file():
    try:

        json_file = request.get_json()
        summary = json_file.get('summary', '')
        data = json.dumps(json_file)

        with open('file_name.txt','r') as f:
            filename = f.read()
        text_file_path = f'{filename}.txt'

        with open(text_file_path, 'w') as file:
            file.write(summary)

        with open(text_file_path, 'r') as f:
            data = f.readlines()

        csv_file = f'{text_file_path.split(".")[0]}.csv'
        final_csv_file = f'{text_file_path.split(".")[0]}_0.csv'
        i =0

        with open(csv_file, newline='') as in_file, open(final_csv_file, 'w', newline='') as out_file:

            headers = ['Id', 'X12 Node name', 'X12 Comments', ' Canonical Node name', ' Canonical Comments']
            dw = csv.DictWriter(out_file, delimiter=',', fieldnames=headers)
            dw.writeheader()
            reader = csv.reader(in_file)
            next(reader, None)  # Skip the header row
            for row in reader:

                if row[2] != '' and row[3] != '' or row[4] != '':
                    row[3] = data[i].split(": ")[1].strip()
                    i += 1

                writer = csv.writer(out_file)
                writer.writerow(row)

        return jsonify({"status":"Generated"})

    except Exception as e:
        return jsonify({"error": str(e)})


@app.route('/get/details',methods=['get'])
def get_details():

    with open('file_name.txt', 'r') as f:
        filename = f.read().strip()

    csv_path = f'{filename}_0.csv'
    # final_csv_path = f'{filename}_final.csv'
    json_path = f'{filename}.json'

    headers = ['Id', 'X12 Node name', 'X12 Comments', 'Canonical Node name', 'Canonical Comments']

    with open(csv_path, newline='') as csvfile:
        reader = csv.DictReader(csvfile, fieldnames=headers)
        data = [row for row in reader]

    with open(json_path, 'w') as jsonfile:
        json.dump(data, jsonfile)

    with open(json_path, "r") as json_file:
        json_data = json.load(json_file)
        for item in json_data:
            if 'X12 Comments' in item:
                item['X12 Comments'] = item['X12 Comments'].split(',')

    ordered_data = []
    for item in json_data:
        ordered_item = {
            'Id': item['Id'],
            'X12 Node name': item['X12 Node name'],
            'X12 Comments': item['X12 Comments'],
            'Canonical Node name': item['Canonical Node name'],
            'Canonical Comments': item['Canonical Comments']
        }
        ordered_data.append(ordered_item)
    ordered_data.pop(0)

    # Convert the ordered data to a JSON string
    response_data = json.dumps(ordered_data, indent=4)
    return response_data


if __name__ == "__main__":
    app.run(debug=True)
