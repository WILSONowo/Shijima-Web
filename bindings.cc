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

class ext;

class drawinfo {
public:
    friend class ext;
    double getX() const { return x; }
    double getY() const { return y; }
    double getWidth() const { return width; }
    double getHeight() const { return height; }
    bool getMirrored() const { return mirrored; }
private:
    double x, y, width, height;
    bool mirrored;
};

class ext {
public:
    // MascotFactory.registerTemplate()
    void registerTemplate(
        string const& name,
        string const& path, string const& actionsXML,
        string const& behaviorsXML);
    // MascotFactory.spawnAdam()
    mascot::manager *spawnAdam(string const& name, double x, double y,
        string const& behavior, bool looking_right);
    // MascotEnvironment.setViewport()
    void setViewport(double width, double height);
    // MascotManager.getX()
    double getX();
    // MascotManager.getY()
    double getY();
    // MascotManager.getDrawInfo()
    const drawinfo *getDrawInfo(double imageWidth, double imageHeight);
    // MascotManager.getDrawInfo()
    std::string getImageName();
    // MascotManager.getActiveBehavior()
    std::string getActiveBehavior();
    // MascotEnvironment.startTick()
    void startTick();
    // MascotEnvironment.moveMouse()
    void moveMouse(double x, double y);
    // MascotEnvironment.endTick()
    void endTick();
    // MascotManager.setDragging()
    void setDragging(bool dragged);
    // MascotEnvironment.setSubticks()
    void setSubticks(int subticks);
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

void ext::setViewport(double width, double height) {
    auto &env = *(mascot::environment *)this;
    env.screen = { 0, width, height, 0 };
    env.work_area = { 0, width, height, 0 };
    env.floor = { height, 0, width };
    env.ceiling = { 0, 0, width };
}

const drawinfo *ext::getDrawInfo(double imageWidth, double imageHeight) {
    static drawinfo info;
    auto &state = *((mascot::manager *)this)->get_state();
    if (state.looking_right) {
        info.x = state.anchor.x - imageWidth + state.active_frame.anchor.x;
    }
    else {
        info.x = state.anchor.x - state.active_frame.anchor.x;
    }
    info.y = state.anchor.y - state.active_frame.anchor.y;
    info.width = imageWidth;
    info.height = imageHeight;
    info.mirrored = state.active_frame.right_name.empty() && state.looking_right;
    return &info;
}

std::string ext::getImageName() {
    auto &state = *((mascot::manager *)this)->get_state();
    return state.active_frame.get_name(state.looking_right);
}

shared_ptr<mascot::factory> constructMascotFactory(shared_ptr<scripting::context> ctx,
    shared_ptr<mascot::environment> env)
{
    auto factory = make_shared<mascot::factory>();
    factory->env = env;
    factory->script_ctx = ctx;
    return factory;
}

mascot::manager *ext::spawnAdam(string const& name, double x, double y,
    string const& behavior, bool looking_right)
{
    auto &factory = *(mascot::factory *)this;
    mascot::manager::initializer init { { x, y }, behavior, looking_right };
    auto product = factory.spawn(name, init);
    return product.manager.release();
}

std::string ext::getActiveBehavior() {
    auto &manager = *((mascot::manager *)this);
    auto behavior = manager.active_behavior();
    return (behavior == nullptr) ? "" : behavior->name;
}

void ext::moveMouse(double x, double y) {
    auto &env = *((mascot::environment *)this);
    env.cursor.move({ x, y });
}

void ext::startTick() {

}

void ext::endTick() {
    auto &env = *((mascot::environment *)this);
    env.cursor.dx = env.cursor.dy = 0;
}

void ext::setDragging(bool dragging) {
    auto &manager = *((mascot::manager *)this);
    manager.get_state()->dragging = dragging;
}

void ext::setSubticks(int subticks) {
    auto &env = *((mascot::environment *)this);
    env.subtick_count = subticks;
}

EMSCRIPTEN_BINDINGS(shijima_web) {
    class_<scripting::context>("ScriptContext")
        .smart_ptr_constructor("ScriptContext", &make_shared<scripting::context>)
        .function("eval", &scripting::context::eval_json)
        ;
    class_<mascot::environment>("MascotEnvironment")
        .smart_ptr_constructor("MascotEnvironment", &make_shared<mascot::environment>)
        .function("startTick", f<mascot::environment>(&ext::startTick))
        .function("endTick", f<mascot::environment>(&ext::endTick))
        .function("moveMouse", f<mascot::environment>(&ext::moveMouse))
        .function("setViewport", f<mascot::environment>(&ext::setViewport))
        .function("setSubticks", f<mascot::environment>(&ext::setSubticks))
        ;
    class_<mascot::factory>("MascotFactory")
        .smart_ptr_constructor("MascotFactory", &constructMascotFactory,
            allow_raw_pointers())
        .function("registerTemplate", f<mascot::factory>(&ext::registerTemplate))
        .function("spawnAdam", f<mascot::factory>(&ext::spawnAdam),
            allow_raw_pointers())
        ;
    class_<drawinfo>("MascotDrawInfo")
        .function("getX", &drawinfo::getX)
        .function("getY", &drawinfo::getY)
        .function("getWidth", &drawinfo::getWidth)
        .function("getHeight", &drawinfo::getHeight)
        .function("getMirrored", &drawinfo::getMirrored)
        ;
    class_<mascot::manager>("MascotManager")
        .function("tick", &mascot::manager::tick)
        .function("getActiveBehavior", f<mascot::manager>(&ext::getActiveBehavior))
        .function("getImageName", f<mascot::manager>(&ext::getImageName))
        .function("getDrawInfo", f<mascot::manager>(&ext::getDrawInfo),
            allow_raw_pointers())
        .function("setDragging", f<mascot::manager>(&ext::setDragging))
        .function("getX", f<mascot::manager>(&ext::getX))
        .function("getY", f<mascot::manager>(&ext::getY))
        ;
}
