import json
import random

def generate_tree(max_nodes, max_children):
    nodes = []
    nodes.append({"id": "0", "children": [], "parent": None})  # Root node
    
    for current_id in range(1, max_nodes):  # Start from 1 to avoid root
        # Choose a random parent from existing nodes
        parent_id = random.randint(0, current_id - 1)
        
        # Ensure the parent node has not exceeded the maximum number of children
        while len([n for n in nodes if n["parent"] == str(parent_id)]) >= max_children:
            parent_id = random.randint(0, current_id - 1)

        # Append current node with its parent
        nodes.append({"id": str(current_id), "children": [], "parent": str(parent_id)})
        # Update the parent's children list
        nodes[parent_id]["children"].append(str(current_id))
    
    return nodes

# Parameters
max_nodes = 1000
max_children = 8  # Maximum number of children per node

# Generate the tree
tree = generate_tree(max_nodes, max_children)

# Save the tree to a JSON file
with open('tree.json', 'w') as json_file:
    json.dump(tree, json_file, indent=4)

print("Tree has been saved to tree.json")
