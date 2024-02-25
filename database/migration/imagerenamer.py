# gpt wrote this, sorry not sorry :)
import os
import shutil

def rename_and_move_files(source_directory, destination_directory):
    for root, dirs, files in os.walk(source_directory):
        for dir_name in dirs:
            uuid = dir_name
            folder_path = os.path.join(root, dir_name)
            file_path = os.path.join(folder_path, 'file')
            
            if os.path.exists(file_path):
                new_file_name = os.path.join(destination_directory, f'{uuid}')
                os.rename(file_path, new_file_name)
                print(f'Renamed: {file_path} -> {new_file_name}')
            else:
                print(f'Skipped: No "file" found in {folder_path}')

if __name__ == "__main__":
    source_directory = "depot"
    destination_directory = "newdepot"
    
    # Create the destination directory if it doesn't exist
    os.makedirs(destination_directory, exist_ok=True)
    
    rename_and_move_files(source_directory, destination_directory)
