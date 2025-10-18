import { useEffect, useState } from 'react';
import './PlannerRSVP.css';

export default function PlannerRSVP() {
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [eventData, setEventData] = useState(null);
    const [guestData, setGuestData] = useState(null);
    const [rsvpParams, setRsvpParams] = useState({ eventId: '', guestToken: '', response: '' });

    useEffect(() => {
        // Extract parameters from URL path
        // Expected format: /rsvp/{eventId}/{guestId}/{accept|decline}
        const path = window.location.pathname;
        const pathParts = path.split('/');
        
        // Find the rsvp index and extract parameters
        const rsvpIndex = pathParts.indexOf('rsvp');
        if (rsvpIndex !== -1 && pathParts.length >= rsvpIndex + 4) {
            const eventId = pathParts[rsvpIndex + 1];
            const guestToken = pathParts[rsvpIndex + 2];
            const response = pathParts[rsvpIndex + 3];
            
            setRsvpParams({ eventId, guestToken, response });
        } else {
            setError('Invalid RSVP URL format');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const processRSVP = async () => {
            try {
                setLoading(true);

                const { eventId, guestToken, response } = rsvpParams;

                // Validate response parameter
                if (response !== 'accept' && response !== 'decline') {
                    throw new Error('Invalid RSVP response');
                }

                // Process the RSVP
                const rsvpResponse = await fetch(
                    `https://us-central1-planit-sdp.cloudfunctions.net/api/rsvp/${eventId}/${guestToken}/${response}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    }
                );

                if (!rsvpResponse.ok) {
                    const errorText = await rsvpResponse.text();
                    throw new Error(`Failed to process RSVP: ${rsvpResponse.status}`);
                }

                
                const responseData = await rsvpResponse.json();
                const eventInfo = responseData.event;
                console.log(eventInfo)
                const guestInfo = responseData.guest;

                setResult({
                    success: true,
                    response: response,
                    message: response === 'accept' 
                        ? 'Thank you for accepting the invitation!'
                        : 'Thank you for your response. We\'re sorry you can\'t make it.'
                });

                setEventData(eventInfo || {
                    name: 'Your Event',
                    date: new Date().toLocaleString(),
                });

                setGuestData(guestInfo || {
                    firstname: 'Guest',
                    email: 'your email address'
                });

            } catch (err) {
                console.error('RSVP Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (rsvpParams.eventId && rsvpParams.guestToken && rsvpParams.response) {
            processRSVP();
        } else if (rsvpParams.eventId === '' && rsvpParams.guestToken === '' && rsvpParams.response === '') {
            // Still extracting parameters
            return;
        } else {
            setError('Missing required parameters in URL');
            setLoading(false);
        }
    }, [rsvpParams]);

    if (loading) {
        return (
            <main className="rsvp-page">
                <section className="rsvp-container">
                    <article className="loading-card">
                        <div className="loading-spinner"></div>
                        <h2>Processing your RSVP...</h2>
                        <p>Please wait while we update your response.</p>
                    </article>
                </section>
            </main>
        );
    }

    if (error) {
        return (
            <main className="rsvp-page">
                <section className="rsvp-container">
                    <article className="error-card">
                        <h2>Oops! Something went wrong</h2>
                        <p>{error}</p>
                        <p>Please contact the event organizer if this problem persists.</p>
                        <button 
                            className="retry-button"
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </button>
                    </article>
                </section>
            </main>
        );
    }

    if (result?.success) {
        const isAccepted = rsvpParams.response === 'accept';
        
        return (
            <main className="rsvp-page">
                <section className="rsvp-container">
                    <article className="success-card">
                        <header className="brand-header">
                            <h1 className="brand-title">PlanIT</h1>
                            <p className="brand-subtitle">Event Management</p>
                        </header>

                        <section className={`status-section ${isAccepted ? 'accepted' : 'declined'}`}>
                            <div className="status-icon">
                            </div>
                            <h2 className="status-title">
                                {isAccepted ? 'RSVP Confirmed!' : 'Response Received'}
                            </h2>
                        </section>

                        <section className="event-details">
                            <h3 className="event-title">{eventData?.name || 'Event'}</h3>
                            {eventData?.date && (
                                <p className="event-date">
                                    {new Date(eventData.date).toLocaleDateString()}
                                </p>
                            )}
                        </section>

                        <section className="message-section">
                            <p className="main-message">
                                {isAccepted 
                                    ? `Thank you, ${guestData?.firstname || 'Guest'}! We're excited to have you join us.`
                                    : `Thank you for your response, ${guestData?.firstname || 'Guest'}. We're sorry you won't be able to join us.`
                                }
                            </p>
                            
                            {!isAccepted && (
                                <p className="additional-message">
                                    If your plans change, please feel free to contact the event organizer.
                                </p>
                            )}
                        </section>

                        <section className="confirmation-section">
                            <p className="confirmation-text">
                                A confirmation email has been sent to {guestData?.email || 'your email address'}.
                            </p>
                        </section>

                        <footer className="rsvp-footer">
                            <p>Best regards,</p>
                            <strong>The PlanIT Team</strong>
                        </footer>
                    </article>
                </section>
            </main>
        );
    }

    return null;
}