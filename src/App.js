import React, { useState, useEffect } from 'react';
import './App.css';
import _ from 'lodash'; //Importing Loadash for 
import Modal from 'react-modal'; //Importing Modal

// Setting up the root element for the EditModal
Modal.setAppElement('#root');

function App() {
  // State variables
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [sortAscending, setSortAscending] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);

  // Fetch random users
  useEffect(() => {
    fetchRandomUsers();
  }, []);

  // Fetch random users from the API
  const fetchRandomUsers = async () => {
    try {
      // Getting the users using fetch
      const response = await fetch('https://randomuser.me/api/?inc=login,name,email,cell,location,picture&results=200');
      
      if (!response.ok) {
        throw new Error('Response has errors');
      }

      // Grabbing the data from ther reponse json
      const data = await response.json(); 

      setUsers(data.results);
      setFilteredUsers(data.results);
      
    } catch (error) {
      console.error('fetching has errors', error);
    }
  };

///////////////////--------------- Search Function ----------------///////////////////

  // Handle input change in the search bar
  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    filterUsers(e.target.value);
  };

  // Filter users based on the search query
  const filterUsers = (query) => {
    const filtered = users.filter((user) => {
      const searchString = `${user.name.first} ${user.name.last} ${user.email} ${user.cell} ${user.location.city} ${user.location.state}`.toLowerCase();
      return searchString.includes(query.toLowerCase());
    });
    setFilteredUsers(filtered);
  };

///////////////////--------------- Sort Function ----------------///////////////////

  // Sort the random users by name A-Z or Z-A
  const handleSortByName = () => {
    const sortedUsers = _.sortBy(filteredUsers, [(user) => `${user.name.first} ${user.name.last}`]);
    setFilteredUsers(sortAscending ? sortedUsers : sortedUsers.reverse());
    setSortAscending(!sortAscending);
  };

///////////////////--------------- Edit Card Function ----------------////////////////

  // Handle click on the "Edit" button
  const handleEditClick = (user) => {
    
    // Setting editing state
    setIsEditing(true);

    setEditedUser(user);
  };

  // Handle Save after editing the user
  const handleSaveEdit = (updatedUserData) => {
    
    // Find the edited user in the list by the login.username
    const updatedUsers = users.map((user) =>
      user.login.username === updatedUserData.login.username ? updatedUserData : user
    );

    // Update both users state
    setUsers(updatedUsers);
    // Update both filtered users state
    setFilteredUsers(updatedUsers);

    // Reset editing state
    setIsEditing(false);
    setEditedUser(null);
  };

  // Handle canceling the edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedUser(null);
  };

  ///////////////////--------------- Rendering Cards ----------------////////////////
  return (
    <div className="App">
      <h1>Random People</h1>
      <input
        type="text"
        placeholder="Search for people"
        value={searchInput}
        onChange={handleSearchChange}
      />
      <button onClick={handleSortByName}>
        Sort by Name {sortAscending ? 'A-Z' : 'Z-A'}
      </button>
      <div className="card-grid">
        {filteredUsers.map((user) => (
          <div key={user.login.username} className="card">
            {isEditing && editedUser && editedUser.login.uuid === user.login.uuid ? (
              // Render edit modal for editing
              <EditModal user={user} onSaveEdit={handleSaveEdit} onCancelEdit={handleCancelEdit} />

            ) : (
              // Render user cards
              <>
                <button className="edit-button" onClick={() => handleEditClick(user)}>
                  <i className="fas fa-user-pen"></i> 
                </button>
                <h3>{`${user.name.first} ${user.name.last}`}</h3>
                <img src={user.picture.large} alt={`${user.name.first} ${user.name.last}`} />
                <p>{user.email}</p>
                <p>{user.cell}</p>
                <p>{user.location.city}, {user.location.state} </p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

///////////////////--------------- Edit Modal ----------------////////////////

// Modal to edit user data
const EditModal = ({ user, onSaveEdit, onCancelEdit }) => {
  const [editedUserData, setEditedUserData] = useState({
    name: { ...user.name },
    image: user.picture.large,
    email: user.email,
    cell: user.cell,
    location: { ...user.location }
  });

  // Handle input changes in the edit modal
  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      // Handle file inputs for the image
      const file = files[0];
      const reader = new FileReader();
  
      reader.onloadend = () => {
        setEditedUserData((prevData) => ({
          ...prevData,
          image: reader.result,
        }));
      };
  
      if (file) {
        reader.readAsDataURL(file);
      }
    } else if (name.startsWith('name.')) {

      // Handle first and last names separately because these are parts of the user.name

      const nameField = name.split('.')[1]; // Extract 'first' or 'last' name

      setEditedUserData((prevData) => ({
        ...prevData,
        name: {
          ...prevData.name,
          [nameField]: value,
        },
      }));
    }else if (name.startsWith('location.')) {

      // Handle city and state separately because these are parts of the user.location

      const locationField = name.split('.')[1]; // Extract 'city' or 'state'

      setEditedUserData((prevData) => ({
        ...prevData,
        location: {
          ...prevData.location,
          [locationField]: value,
        },
      }));
    } else {

      // Handle the rest of the inputs
      setEditedUserData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  // Handle save button click in the EditModal
  const handleSave = () => {
    onSaveEdit({ ...user, ...editedUserData });
  };


///////////////////---------------Rendering Edit Model ----------------////////////////
  return (
    <Modal
      isOpen={true}
      onRequestClose={onCancelEdit}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          width: '400px'
        }
      }}
    >
      <div>
        <h3>Edit User</h3>
        <div>
          <label>First Name:</label>
          <input type="text" name="name.first" value={editedUserData.name.first} onChange={handleInputChange} />
        </div>
        <div>
          <label>Last Name:</label>
          <input type="text" name="name.last" value={editedUserData.name.last} onChange={handleInputChange} />
        </div>
        <div>
          {editedUserData.image && (
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <img src={editedUserData.image} alt="User"
                style={{
                  maxWidth: '100%',
                  maxHeight: '150px',
                  borderRadius: '8px',
                }}
              />
            </div>
          )}
          <input type="file" accept="image/*" onChange={(e) => handleInputChange(e)} />
        </div>
        <div>
          <label>Email:</label>
          <input type="text" name="email" value={editedUserData.email} onChange={handleInputChange} />
        </div>
        <div>
          <label>Cell:</label>
          <input type="text" name="cell" value={editedUserData.cell} onChange={handleInputChange} />
        </div>
        <div>
          <label>City:</label>
          <input type="text" name="location.city" value={editedUserData.location.city} onChange={handleInputChange} />
        </div>
        <div>
          <label>State:</label>
          <input type="text" name="location.state" value={editedUserData.location.state} onChange={handleInputChange} />
        </div>
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <button onClick={handleSave}>Save</button>
          <button onClick={onCancelEdit}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
};

export default App;
