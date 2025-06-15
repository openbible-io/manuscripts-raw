import { render, Component } from "preact";
import { LocationProvider, Router, Route } from "preact-iso";
import { Documents } from "./documents";
import { Document } from "./document";

class ErrorBoundary extends Component {
	state = { error: null };

	static getDerivedStateFromError(error: Error) {
		return { error: error.message };
	}

	componentDidCatch(error: Error) {
		console.error(error);
		this.setState({ error: error.message });
	}

	render() {
		if (this.state.error) return <p>{this.state.error}</p>

		return this.props.children;
	}
}

const App = () => (
	<LocationProvider>
		<ErrorBoundary>
			<Router>
				<Route path="/" component={Documents} />
				<Route path="/:docId" component={Document} />
				<Route path="/:docId/:sectionId" component={Document} />
			</Router>
		</ErrorBoundary>
	</LocationProvider>
);

render(<App />, document.body);
