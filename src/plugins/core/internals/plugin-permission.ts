import { Contracts } from "@payvo/profiles";
import { PluginController } from "plugins/core/plugin-controller";
import { PluginServiceData } from "plugins/core/plugin-service";

interface MiddlewareContext {
	profile: Contracts.IProfile;
	plugin: PluginController;
	service?: PluginServiceData;
}

type Rule<T = any> = (context: MiddlewareContext) => (result: T) => T | never;

export const isServiceDefinedInConfig: Rule = ({ service, plugin }) => (result) => {
	if (!!service && plugin.config().permissions()?.includes(service.id())) {
		return result;
	}
	return console.error.bind(
		console,
		`The plugin ${plugin.config().name()} did not define ${service?.id()} its permissions.`,
	);
};

// TODO:
export const isServiceEnabled: Rule = () => (result) => result;

export const isPluginEnabled: Rule = ({ profile, plugin }) => (result) => {
	if (plugin.isEnabled(profile)) {
		return result;
	}

	return console.error.bind(console, `The plugin ${plugin.config().name()} is not enabled by the current profile.`);
};

export const applyPluginMiddlewares = (context: MiddlewareContext, rules: Rule[]) => (response: any) =>
	rules.reduce((accumulator, rule) => rule(context)(accumulator), response);
