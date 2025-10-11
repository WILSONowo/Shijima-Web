#include <emscripten/bind.h>
#include <shijima/mascot/factory.hpp>
#include <memory>

using namespace std;
using namespace emscripten;
using namespace shijima;

template<typename TReal, typename TFake, typename TRet, typename ...Args>
auto f(TRet(TFake::*fake)(Args...)) {
    return (TRet(TReal::*)(Args...))fake;
}

class ext {
public:
    void registerTemplate(
        string const& name,
        string const& path, string const& actionsXML,
        string const& behaviorsXML);
    mascot::manager *spawnAdam(string const& name,
        shared_ptr<mascot::manager::initializer> init);
    void tick100Times();
    double getX();
    double getY();
};

double ext::getX() { return ((mascot::manager *)this)->get_state()->anchor.x; }
double ext::getY() { return ((mascot::manager *)this)->get_state()->anchor.y; }

void ext::registerTemplate(
    string const& name,
    string const& path, string const& actionsXML,
    string const& behaviorsXML)
{
    auto &factory = *(mascot::factory *)this;
    mascot::factory::tmpl tmpl;
    tmpl.name = name;
    tmpl.path = path;
    tmpl.actions_xml = actionsXML;
    tmpl.behaviors_xml = behaviorsXML;
    factory.register_template(tmpl);
}

shared_ptr<mascot::manager::initializer> constructMascotInitializer(double x,
    double y, string const& behavior, bool looking_right)
{
    auto init = make_shared<mascot::manager::initializer>();
    init->anchor = { x, y };
    init->behavior = behavior;
    init->looking_right = looking_right;
    return init;
}

shared_ptr<mascot::factory> constructMascotFactory(shared_ptr<scripting::context> ctx,
    shared_ptr<mascot::environment> env)
{
    auto factory = make_shared<mascot::factory>();
    factory->env = env;
    factory->script_ctx = ctx;
    return factory;
}

mascot::manager *ext::spawnAdam(string const& name,
    shared_ptr<mascot::manager::initializer> init)
{
    auto &factory = *(mascot::factory *)this;
    auto product = factory.spawn(name, (init == nullptr) ?
        mascot::manager::initializer{} : *init);
    return product.manager.release();
}

void ext::tick100Times() {
    for (int i=0; i<100; ++i) {
        ((mascot::manager *)this)->tick();
    }
}

EMSCRIPTEN_BINDINGS(shijima_web) {
    class_<scripting::context>("ScriptContext")
        .smart_ptr_constructor("ScriptContext", &make_shared<scripting::context>)
        .function("eval", &scripting::context::eval_json)
        ;
    class_<mascot::environment>("MascotEnvironment")
        .smart_ptr_constructor("MascotEnvironment", &make_shared<mascot::environment>)
        ;
    class_<mascot::manager::initializer>("MascotInitializer")
        .smart_ptr_constructor("MascotInitializer", &constructMascotInitializer,
            allow_raw_pointers())
        ;
    class_<mascot::factory>("MascotFactory")
        .smart_ptr_constructor("MascotFactory", &constructMascotFactory,
            allow_raw_pointers())
        .function("registerTemplate", f<mascot::factory>(&ext::registerTemplate))
        .function("spawnAdam", f<mascot::factory>(&ext::spawnAdam),
            allow_raw_pointers())
        ;
    class_<mascot::manager>("MascotManager")
        .function("tick", &mascot::manager::tick)
        .function("tick100Times", f<mascot::manager>(&ext::tick100Times))
        .function("getX", f<mascot::manager>(&ext::getX))
        .function("getY", f<mascot::manager>(&ext::getY))
        ;
}
