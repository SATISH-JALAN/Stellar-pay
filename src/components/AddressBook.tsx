import { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import './AddressBook.css';

interface Contact {
    id: string;
    nickname: string;
    address: string;
}

interface AddressBookProps {
    onSelectAddress: (address: string) => void;
}

const STORAGE_KEY = 'stellar-pay-address-book';

export const AddressBook = ({ onSelectAddress }: AddressBookProps) => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newNickname, setNewNickname] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [error, setError] = useState('');

    // Load contacts from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setContacts(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to load address book:', e);
            }
        }
    }, []);

    // Save contacts to localStorage
    const saveContacts = (newContacts: Contact[]) => {
        setContacts(newContacts);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newContacts));
    };

    const handleAddContact = () => {
        setError('');

        if (!newNickname.trim()) {
            setError('Please enter a nickname');
            return;
        }

        if (!newAddress.trim()) {
            setError('Please enter an address');
            return;
        }

        if (!newAddress.startsWith('G') || newAddress.length !== 56) {
            setError('Invalid Stellar address');
            return;
        }

        if (contacts.some(c => c.address === newAddress)) {
            setError('Address already exists');
            return;
        }

        const newContact: Contact = {
            id: Date.now().toString(),
            nickname: newNickname.trim(),
            address: newAddress.trim(),
        };

        saveContacts([...contacts, newContact]);
        setNewNickname('');
        setNewAddress('');
        setIsAdding(false);

        // Animate new contact
        setTimeout(() => {
            gsap.fromTo('.contact-item:last-child',
                { opacity: 0, x: -20 },
                { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
            );
        }, 50);
    };

    const handleDeleteContact = (id: string) => {
        const updated = contacts.filter(c => c.id !== id);
        saveContacts(updated);
    };

    const handleSelectContact = (address: string) => {
        onSelectAddress(address);
        setIsOpen(false);
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 8)}...${address.slice(-8)}`;
    };

    return (
        <div className="address-book">
            <button
                className="address-book-btn"
                onClick={() => setIsOpen(!isOpen)}
                title="Address Book"
            >
                📒 Address Book
            </button>

            {isOpen && (
                <div className="address-book-dropdown">
                    <div className="dropdown-header">
                        <h4>Address Book</h4>
                        <button
                            className="add-contact-btn"
                            onClick={() => setIsAdding(!isAdding)}
                        >
                            {isAdding ? '✕' : '+'}
                        </button>
                    </div>

                    {isAdding && (
                        <div className="add-contact-form">
                            <input
                                type="text"
                                placeholder="Nickname"
                                value={newNickname}
                                onChange={(e) => setNewNickname(e.target.value)}
                                className="contact-input"
                            />
                            <input
                                type="text"
                                placeholder="Stellar Address (GABC...)"
                                value={newAddress}
                                onChange={(e) => setNewAddress(e.target.value)}
                                className="contact-input"
                            />
                            {error && <span className="contact-error">{error}</span>}
                            <button className="save-contact-btn" onClick={handleAddContact}>
                                Save Contact
                            </button>
                        </div>
                    )}

                    <div className="contacts-list">
                        {contacts.length === 0 ? (
                            <p className="no-contacts">No saved contacts yet</p>
                        ) : (
                            contacts.map((contact) => (
                                <div key={contact.id} className="contact-item">
                                    <div
                                        className="contact-info"
                                        onClick={() => handleSelectContact(contact.address)}
                                    >
                                        <span className="contact-nickname">{contact.nickname}</span>
                                        <span className="contact-address">{formatAddress(contact.address)}</span>
                                    </div>
                                    <button
                                        className="delete-contact-btn"
                                        onClick={() => handleDeleteContact(contact.id)}
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
